use actix_web::{App, HttpServer, middleware::Logger};
use dotenv::dotenv;
use env_logger::Env;

mod routes;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(Env::default().default_filter_or("info"));

    dotenv().ok();

    let port = std::env::var("PORT").expect("Missing env PORT");

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .service(actix_files::Files::new("/_static", "./static").show_files_listing())
            .service(routes::landing_page)
    })
    .bind(("0.0.0.0", port.parse::<u16>().unwrap()))?
    .run()
    .await
}
