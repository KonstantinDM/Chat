use std::{
    collections::HashMap,
    net::{TcpListener, TcpStream},
    sync::{Arc, Mutex},
    thread,
    io::{Read, Write},
};

type ClientList = Arc<Mutex<HashMap<String, TcpStream>>>;

fn handle_client(mut stream: TcpStream, clients: ClientList) {
    let addr = stream.peer_addr().unwrap().to_string();
    println!("Новое подключение: {}", addr);

    // Добавляем клиента в список
    {
        let mut clients = clients.lock().unwrap();
        clients.insert(addr.clone(), stream.try_clone().unwrap());
    }

    let mut buffer = [0; 1024];
    loop {
        match stream.read(&mut buffer) {
            Ok(0) => {
                // Клиент отключился
                println!("Клиент отключился: {}", addr);
                let mut clients = clients.lock().unwrap();
                clients.remove(&addr);
                break;
            }
            Ok(n) => {
                let message = String::from_utf8_lossy(&buffer[..n]);
                println!("Сообщение от {}: {}", addr, message);

                // Отправляем сообщение всем клиентам, кроме отправителя
                let mut clients = clients.lock().unwrap();
                for (client_addr, client_stream) in clients.iter_mut() {
                    if *client_addr != addr {
                        if let Err(e) = client_stream.write_all(message.as_bytes()) {
                            println!("Ошибка отправки сообщения клиенту {}: {}", client_addr, e);
                        }
                    }
                }
            }
            Err(e) => {
                println!("Ошибка чтения от клиента {}: {}", addr, e);
                let mut clients = clients.lock().unwrap();
                clients.remove(&addr);
                break;
            }
        }
    }
}

fn main() {
    let listener = TcpListener::bind("0.0.0.0:8080").unwrap();
    println!("Сервер запущен на 0.0.0.0:8080");

    let clients: ClientList = Arc::new(Mutex::new(HashMap::new()));

    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                let clients = Arc::clone(&clients);
                thread::spawn(move || {
                    handle_client(stream, clients);
                });
            }
            Err(e) => {
                println!("Ошибка подключения: {}", e);
            }
        }
    }
}
