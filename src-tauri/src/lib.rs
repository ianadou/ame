use std::fs;
use std::io::Write;
use std::net::TcpStream;
use std::path::PathBuf;
use std::time::{Duration, Instant};

use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

const HOST: &str = "127.0.0.1";
const PORT: u16 = 3001;

/// Ajoute une ligne au journal du sidecar (best-effort, erreurs ignorées).
/// Ce fichier est la seule source de diagnostic quand le serveur Nitro
/// échoue au démarrage côté empaqueté (sinon : « connexion refusée » nu).
fn log_line(log_path: &PathBuf, line: &str) {
    if let Ok(mut f) = fs::OpenOptions::new().create(true).append(true).open(log_path) {
        let _ = writeln!(f, "{line}");
    }
}

/// Tauri résout les ressources sous Windows en chemin « extended-length »
/// (préfixe `\\?\`) qui interdit les `/`. Drizzle concatène ensuite
/// `${dir}/meta/_journal.json` → ENOENT, migrations sautées, toutes les
/// tables manquent. On normalise donc côté Rust avant de transmettre au
/// sidecar Node. No-op sur les autres OS.
fn strip_windows_extended_prefix(p: String) -> String {
    p.strip_prefix(r"\\?\").map(|s| s.to_string()).unwrap_or(p)
}

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
            let server_entry = strip_windows_extended_prefix(server_entry.to_string_lossy().to_string());

            // Dossier données par-utilisateur, inscriptible (ex. Windows
            // %APPDATA%\ci.ame.desktop, Linux ~/.local/share/ci.ame.desktop).
            // La base SQLite y vit pour survivre aux mises à jour et ne pas
            // dépendre du cwd imprévisible du sidecar.
            let data_dir = app.path().app_data_dir()?;
            fs::create_dir_all(&data_dir)?;
            let db_file = data_dir.join("ame.db");
            let db_file = db_file.to_string_lossy().to_string();

            // Journal du sidecar : réinitialisé à chaque lancement pour
            // refléter la dernière exécution. Chemin affiché à l'utilisateur
            // en cas d'échec serveur.
            let log_path = data_dir.join("sidecar.log");
            let _ = fs::remove_file(&log_path);
            log_line(&log_path, "=== AME sidecar — démarrage ===");

            // Migrations Drizzle empaquetées (appliquées au démarrage serveur).
            let migrations_dir = app
                .path()
                .resolve("migrations", tauri::path::BaseDirectory::Resource)?;
            let migrations_dir = strip_windows_extended_prefix(migrations_dir.to_string_lossy().to_string());

            log_line(&log_path, &format!("server_entry  = {server_entry}"));
            log_line(&log_path, &format!("db_file       = {db_file}"));
            log_line(&log_path, &format!("migrations_dir= {migrations_dir}"));

            // Lance `bun .output/server/index.mjs` en sidecar (tué à la sortie).
            let (mut rx, _child) = app
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

            // Redirige stdout/stderr du serveur Nitro vers le journal : sans
            // ça, un crash au démarrage (binding natif libsql manquant, etc.)
            // est totalement silencieux côté webview.
            let log_for_events = log_path.clone();
            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(bytes) => {
                            log_line(
                                &log_for_events,
                                &format!("[out] {}", String::from_utf8_lossy(&bytes).trim_end()),
                            );
                        }
                        CommandEvent::Stderr(bytes) => {
                            log_line(
                                &log_for_events,
                                &format!("[err] {}", String::from_utf8_lossy(&bytes).trim_end()),
                            );
                        }
                        CommandEvent::Error(e) => {
                            log_line(&log_for_events, &format!("[error] {e}"));
                        }
                        CommandEvent::Terminated(payload) => {
                            log_line(
                                &log_for_events,
                                &format!("[exit] code={:?} signal={:?}", payload.code, payload.signal),
                            );
                        }
                        _ => {}
                    }
                }
            });

            // Attend l'ouverture du port (max 30 s) puis affiche la fenêtre.
            let log_for_wait = log_path.clone();
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
                        log_line(
                            &log_for_wait,
                            &format!("serveur Nitro injoignable sur {addr} après 30 s — voir ci-dessus"),
                        );
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
