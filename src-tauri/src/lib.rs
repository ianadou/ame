use std::fs;
use std::net::TcpStream;
use std::time::{Duration, Instant};

use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_shell::ShellExt;

const HOST: &str = "127.0.0.1";
const PORT: u16 = 3001;

/// Démarre le serveur Nitro empaqueté (`.output/server/index.mjs`) via le
/// binaire `bun` embarqué en sidecar, puis ouvre la fenêtre principale sur
/// `http://127.0.0.1:PORT` une fois le serveur prêt.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();

            // Chemin du serveur Nitro dans les ressources empaquetées.
            let server_entry = app
                .path()
                .resolve("output/server/index.mjs", tauri::path::BaseDirectory::Resource)?;
            let server_entry = server_entry.to_string_lossy().to_string();

            // Dossier données par-utilisateur, inscriptible (ex. Windows
            // %APPDATA%\ci.ame.desktop, Linux ~/.local/share/ci.ame.desktop).
            // La base SQLite y vit pour survivre aux mises à jour et ne pas
            // dépendre du cwd imprévisible du sidecar.
            let data_dir = app.path().app_data_dir()?;
            fs::create_dir_all(&data_dir)?;
            let db_file = data_dir.join("ame.db");
            let db_file = db_file.to_string_lossy().to_string();

            // Migrations Drizzle empaquetées (appliquées au démarrage serveur).
            let migrations_dir = app
                .path()
                .resolve("migrations", tauri::path::BaseDirectory::Resource)?;
            let migrations_dir = migrations_dir.to_string_lossy().to_string();

            // Lance `bun .output/server/index.mjs` en sidecar (tué à la sortie).
            let (mut _rx, _child) = app
                .shell()
                .sidecar("bun")?
                .args([server_entry])
                .env("HOST", HOST)
                .env("PORT", PORT.to_string())
                .env("NITRO_HOST", HOST)
                .env("NITRO_PORT", PORT.to_string())
                .env("AME_DB_FILE", db_file)
                .env("AME_MIGRATIONS_DIR", migrations_dir)
                .spawn()?;

            // Attend l'ouverture du port (max 30 s) puis affiche la fenêtre.
            std::thread::spawn(move || {
                let deadline = Instant::now() + Duration::from_secs(30);
                let addr = format!("{HOST}:{PORT}");
                loop {
                    if TcpStream::connect_timeout(
                        &addr.parse().expect("adresse sidecar valide"),
                        Duration::from_millis(500),
                    )
                    .is_ok()
                    {
                        break;
                    }
                    if Instant::now() >= deadline {
                        eprintln!("ame: serveur Nitro injoignable sur {addr} après 30 s");
                        break;
                    }
                    std::thread::sleep(Duration::from_millis(250));
                }

                let url = format!("http://{HOST}:{PORT}");
                let _ = WebviewWindowBuilder::new(
                    &handle,
                    "main",
                    WebviewUrl::External(url.parse().expect("URL serveur valide")),
                )
                .title("AME — Gestion de stock BTP")
                .inner_size(1280.0, 800.0)
                .min_inner_size(1024.0, 640.0)
                .resizable(true)
                .build();
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("erreur au démarrage de l'application AME");
}
