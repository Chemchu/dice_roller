use actix_web::{HttpResponse, Responder, get};
use askama::Template;

#[derive(Template)]
#[template(path = "basics_wrapper.html")]
pub struct BasicsWrapper {
    content: String,
}

#[derive(Template)]
#[template(path = "landing_page.html")]
pub struct LandingPage {}

#[get("/")]
pub async fn landing_page() -> impl Responder {
    let landing_page = LandingPage {};
    let content = landing_page.render().expect("Landing Page not found");
    let template = BasicsWrapper { content };

    let reply_html = askama::Template::render(&template).unwrap();

    HttpResponse::Ok().body(reply_html)
}
