/**
 * This file contains helper functions and templates for generating Dioxus component code
 * These can be used by the AI model or directly in generated applications
 */

export const COMPONENT_TEMPLATES = {
  commonComponents: `use dioxus::prelude::*;

#[derive(Clone, Debug)]
pub struct ButtonProps {
    pub label: String,
    pub onclick: Option<fn()>,
    pub variant: String, // "primary", "secondary", "danger"
    pub disabled: bool,
}

#[component]
pub fn Button(props: ButtonProps) -> Element {
    let classes = match props.variant.as_str() {
        "primary" => "bg-blue-500 hover:bg-blue-600 text-white",
        "secondary" => "bg-gray-500 hover:bg-gray-600 text-white",
        "danger" => "bg-red-500 hover:bg-red-600 text-white",
        _ => "bg-blue-500 hover:bg-blue-600 text-white",
    };

    rsx! {
        button {
            class: format!("px-4 py-2 rounded transition disabled:opacity-50 {}", classes),
            disabled: props.disabled,
            onclick: move |_| {
                if let Some(handler) = props.onclick {
                    handler();
                }
            },
            "{props.label}"
        }
    }
}

#[derive(Clone, Debug)]
pub struct InputProps {
    pub value: String,
    pub onchange: Option<fn(String)>,
    pub placeholder: String,
    pub input_type: String,
    pub required: bool,
}

#[component]
pub fn Input(props: InputProps) -> Element {
    rsx! {
        input {
            class: "w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
            r#type: props.input_type,
            value: props.value,
            placeholder: props.placeholder,
            required: props.required,
            onchange: move |e: FormEvent| {
                if let Some(handler) = props.onchange {
                    handler(e.value());
                }
            }
        }
    }
}

#[component]
pub fn FormField(
    label: String,
    children: Element,
) -> Element {
    rsx! {
        div {
            class: "mb-4",
            label {
                class: "block text-sm font-medium text-gray-700 mb-2",
                "{label}"
            }
            {children}
        }
    }
}

#[component]
pub fn Card(
    title: String,
    children: Element,
) -> Element {
    rsx! {
        div {
            class: "bg-white rounded-lg shadow-md p-6 mb-4",
            h2 {
                class: "text-xl font-bold mb-4 text-gray-800",
                "{title}"
            }
            {children}
        }
    }
}

#[component]
pub fn Table(
    headers: Vec<String>,
    rows: Vec<Vec<String>>,
) -> Element {
    rsx! {
        div {
            class: "overflow-x-auto",
            table {
                class: "min-w-full border-collapse",
                thead {
                    tr {
                        class: "bg-gray-200",
                        for header in headers.iter() {
                            th {
                                class: "border border-gray-300 px-4 py-2 text-left",
                                "{header}"
                            }
                        }
                    }
                }
                tbody {
                    for row in rows.iter() {
                        tr {
                            class: "hover:bg-gray-100",
                            for cell in row.iter() {
                                td {
                                    class: "border border-gray-300 px-4 py-2",
                                    "{cell}"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

#[component]
pub fn Modal(
    is_open: bool,
    title: String,
    on_close: fn(),
    children: Element,
) -> Element {
    if !is_open {
        return rsx! { div {} };
    }

    rsx! {
        div {
            class: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
            div {
                class: "bg-white rounded-lg shadow-lg max-w-md w-full mx-4",
                div {
                    class: "flex justify-between items-center p-6 border-b",
                    h2 {
                        class: "text-xl font-bold",
                        "{title}"
                    }
                    button {
                        class: "text-gray-500 hover:text-gray-700",
                        onclick: move |_| on_close(),
                        "×"
                    }
                }
                div {
                    class: "p-6",
                    {children}
                }
            }
        }
    }
}`,

  crudExample: `use dioxus::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct User {
    pub id: i32,
    pub name: String,
    pub email: String,
    pub role: String,
}

#[component]
pub fn UserManager() -> Element {
    let mut users = use_signal(|| vec![
        User {
            id: 1,
            name: "Alice".to_string(),
            email: "alice@example.com".to_string(),
            role: "Admin".to_string(),
        },
        User {
            id: 2,
            name: "Bob".to_string(),
            email: "bob@example.com".to_string(),
            role: "User".to_string(),
        },
    ]);

    let mut show_add_form = use_signal(|| false);
    let mut new_user = use_signal(|| User {
        id: 0,
        name: String::new(),
        email: String::new(),
        role: "User".to_string(),
    });

    let add_user = move |_| {
        let mut user = new_user();
        user.id = (users().len() + 1) as i32;
        users.push(user);
        show_add_form.set(false);
        new_user.set(User {
            id: 0,
            name: String::new(),
            email: String::new(),
            role: "User".to_string(),
        });
    };

    let delete_user = move |id: i32| {
        users.set(users().into_iter().filter(|u| u.id != id).collect());
    };

    rsx! {
        div {
            class: "w-full p-8",
            h1 {
                class: "text-3xl font-bold mb-6",
                "User Management"
            }

            div {
                class: "mb-4",
                button {
                    class: "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600",
                    onclick: move |_| show_add_form.toggle(),
                    "Add User"
                }
            }

            if show_add_form() {
                div {
                    class: "bg-gray-100 p-4 rounded mb-6",
                    div {
                        class: "mb-4",
                        input {
                            class: "w-full px-3 py-2 border rounded",
                            placeholder: "Name",
                            value: new_user().name,
                            onchange: move |e: FormEvent| {
                                let mut user = new_user();
                                user.name = e.value();
                                new_user.set(user);
                            }
                        }
                    }
                    div {
                        class: "mb-4",
                        input {
                            class: "w-full px-3 py-2 border rounded",
                            placeholder: "Email",
                            value: new_user().email,
                            onchange: move |e: FormEvent| {
                                let mut user = new_user();
                                user.email = e.value();
                                new_user.set(user);
                            }
                        }
                    }
                    button {
                        class: "px-4 py-2 bg-green-500 text-white rounded",
                        onclick: add_user,
                        "Save"
                    }
                }
            }

            div {
                class: "overflow-x-auto",
                table {
                    class: "w-full border-collapse",
                    thead {
                        tr {
                            class: "bg-gray-200",
                            th { class: "border px-4 py-2", "ID" }
                            th { class: "border px-4 py-2", "Name" }
                            th { class: "border px-4 py-2", "Email" }
                            th { class: "border px-4 py-2", "Role" }
                            th { class: "border px-4 py-2", "Actions" }
                        }
                    }
                    tbody {
                        for user in users().iter() {
                            tr {
                                class: "hover:bg-gray-100",
                                td { class: "border px-4 py-2", "{user.id}" }
                                td { class: "border px-4 py-2", "{user.name}" }
                                td { class: "border px-4 py-2", "{user.email}" }
                                td { class: "border px-4 py-2", "{user.role}" }
                                td {
                                    class: "border px-4 py-2",
                                    button {
                                        class: "px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600",
                                        onclick: move |_| delete_user(user.id),
                                        "Delete"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}`,

  formExample: `use dioxus::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FormData {
    pub name: String,
    pub email: String,
    pub message: String,
    pub subscribe: bool,
}

#[component]
pub fn ContactForm() -> Element {
    let mut form_data = use_signal(|| FormData {
        name: String::new(),
        email: String::new(),
        message: String::new(),
        subscribe: false,
    });

    let mut errors = use_signal(|| Vec::<String>::new());
    let mut submitted = use_signal(|| false);

    let validate_form = move || -> Result<(), Vec<String>> {
        let mut err = Vec::new();
        let data = form_data();

        if data.name.trim().is_empty() {
            err.push("Name is required".to_string());
        }
        if data.email.trim().is_empty() || !data.email.contains('@') {
            err.push("Valid email is required".to_string());
        }
        if data.message.trim().is_empty() {
            err.push("Message is required".to_string());
        }

        if err.is_empty() {
            Ok(())
        } else {
            Err(err)
        }
    };

    let handle_submit = move |e: FormEvent| {
        e.prevent_default();
        match validate_form() {
            Ok(()) => {
                submitted.set(true);
                errors.set(Vec::new());
                // Handle successful submission
            }
            Err(err) => {
                errors.set(err);
                submitted.set(false);
            }
        }
    };

    rsx! {
        div {
            class: "w-full max-w-md mx-auto p-8",
            h1 {
                class: "text-2xl font-bold mb-6",
                "Contact Us"
            }

            if !errors().is_empty() {
                div {
                    class: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4",
                    for error in errors().iter() {
                        p { "{error}" }
                    }
                }
            }

            if submitted() {
                div {
                    class: "bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4",
                    p { "Thank you! Your message has been sent." }
                }
            }

            form {
                onsubmit: handle_submit,
                div {
                    class: "mb-4",
                    label {
                        class: "block text-sm font-medium mb-2",
                        "Name"
                    }
                    input {
                        class: "w-full px-3 py-2 border rounded",
                        r#type: "text",
                        value: form_data().name,
                        onchange: move |e: FormEvent| {
                            let mut data = form_data();
                            data.name = e.value();
                            form_data.set(data);
                        }
                    }
                }

                div {
                    class: "mb-4",
                    label {
                        class: "block text-sm font-medium mb-2",
                        "Email"
                    }
                    input {
                        class: "w-full px-3 py-2 border rounded",
                        r#type: "email",
                        value: form_data().email,
                        onchange: move |e: FormEvent| {
                            let mut data = form_data();
                            data.email = e.value();
                            form_data.set(data);
                        }
                    }
                }

                div {
                    class: "mb-4",
                    label {
                        class: "block text-sm font-medium mb-2",
                        "Message"
                    }
                    textarea {
                        class: "w-full px-3 py-2 border rounded",
                        value: form_data().message,
                        onchange: move |e: FormEvent| {
                            let mut data = form_data();
                            data.message = e.value();
                            form_data.set(data);
                        }
                    }
                }

                div {
                    class: "mb-6",
                    input {
                        r#type: "checkbox",
                        checked: form_data().subscribe,
                        onchange: move |e: FormEvent| {
                            let mut data = form_data();
                            data.subscribe = e.value().parse().unwrap_or(false);
                            form_data.set(data);
                        }
                    }
                    label {
                        class: "ml-2",
                        "Subscribe to updates"
                    }
                }

                button {
                    class: "w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600",
                    r#type: "submit",
                    "Send Message"
                }
            }
        }
    }
}`,

  tailwindConfig: `module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{rs,tsx,ts,jsx,js}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};`,
};

export function generateComponentsModFile(): string {
  return `pub mod common;
pub mod pages;

pub use common::*;
pub use pages::*;`;
}

export function generatePagesModFile(): string {
  return `// Page components can be defined here
// Use the common components from the components module`;
}
