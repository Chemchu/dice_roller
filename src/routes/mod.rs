#[derive(Template)]
#[template(path = "landing_page.html")]
pub struct LandingPage {
    translator: i18n::translator::Translator,
}

#[get("/")]
pub async fn landing_page() -> impl Responder {
    let template = LandingPage {
        translator: i18n::translator::Translator::new(),
    };

    let reply_html = askama::Template::render(&template).unwrap();

    HttpResponse::Ok().body(reply_html)
}
