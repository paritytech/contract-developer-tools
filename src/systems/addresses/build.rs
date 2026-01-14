use std::env;
use std::fs;
use std::path::Path;
use std::collections::HashMap;

fn main() {
    let out_dir = env::var("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("addresses.rs");

    // Look for .addresses file in target directory
    // The manifest dir is src/systems/addresses, so we go up to find target/
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let addresses_file = Path::new(&manifest_dir)
        .parent().unwrap()  // src/systems
        .parent().unwrap()  // src
        .parent().unwrap()  // project root
        .join("target")
        .join(".addresses");

    // Tell cargo to rerun if the addresses file changes
    println!("cargo:rerun-if-changed={}", addresses_file.display());

    // Parse addresses file if it exists
    let mut addresses: HashMap<String, [u8; 20]> = HashMap::new();

    if addresses_file.exists() {
        let content = fs::read_to_string(&addresses_file).unwrap_or_default();
        for line in content.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            if let Some((key, value)) = line.split_once('=') {
                let key = key.trim().to_uppercase();
                let value = value.trim();
                if let Some(bytes) = parse_hex_address(value) {
                    addresses.insert(key, bytes);
                }
            }
        }
    }

    // Generate the addresses module
    let mut code = String::new();
    code.push_str("use ink::Address;\n\n");

    for name in &["CONTEXT_REGISTRY", "CONTRACT_REGISTRY", "REPUTATION", "DISPUTES"] {
        let bytes = addresses.get(*name).copied().unwrap_or([0u8; 20]);
        // Use transmute for const construction since Address::from isn't const
        code.push_str(&format!(
            "pub const {}: Address = unsafe {{ core::mem::transmute::<[u8; 20], Address>({:?}) }};\n",
            name, bytes
        ));
    }

    fs::write(&dest_path, code).unwrap();
}

/// Parse a hex string (with or without 0x prefix) into 20 bytes
fn parse_hex_address(s: &str) -> Option<[u8; 20]> {
    let s = s.strip_prefix("0x").unwrap_or(s);
    if s.len() != 40 {
        return None;
    }

    let mut bytes = [0u8; 20];
    for i in 0..20 {
        bytes[i] = u8::from_str_radix(&s[i*2..i*2+2], 16).ok()?;
    }
    Some(bytes)
}
