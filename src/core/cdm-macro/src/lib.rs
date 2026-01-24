use proc_macro::TokenStream;
use proc_macro2::TokenStream as TokenStream2;
use quote::{format_ident, quote};
use syn::{parse_macro_input, Attribute, Item, ItemMod, ItemStruct, LitStr};

/// Find the storage struct name from an ink contract module.
/// Looks for a struct with `#[ink(storage)]` attribute.
fn find_storage_struct(module: &ItemMod) -> Option<syn::Ident> {
    let content = module.content.as_ref()?;

    for item in &content.1 {
        if let Item::Struct(item_struct) = item {
            if has_ink_storage_attr(item_struct) {
                return Some(item_struct.ident.clone());
            }
        }
    }
    None
}

/// Check if a struct has the #[ink(storage)] attribute.
fn has_ink_storage_attr(item: &ItemStruct) -> bool {
    for attr in &item.attrs {
        if is_ink_storage_attr(attr) {
            return true;
        }
    }
    false
}

/// Check if an attribute is #[ink(storage)].
fn is_ink_storage_attr(attr: &Attribute) -> bool {
    if !attr.path().is_ident("ink") {
        return false;
    }

    // Parse the attribute to check for "storage"
    let Ok(nested) = attr.parse_args::<syn::Ident>() else {
        return false;
    };

    nested == "storage"
}

/// The `#[cdm("@polkadot/package")]` attribute macro.
///
/// When applied to an ink! contract module, generates a `reference()` function
/// at the crate level that performs runtime lookup of the contract address
/// via the contracts registry.
///
/// # Example
///
/// ```ignore
/// #[cdm("@polkadot/reputation")]
/// #[ink::contract]
/// mod reputation {
///     #[ink(storage)]
///     pub struct Reputation { ... }
/// }
///
/// // Generated at crate level:
/// pub fn reference() -> reputation::ReputationRef {
///     // runtime lookup via contracts registry
/// }
/// ```
///
/// # Usage
///
/// After applying the macro, consumers can access the contract via:
/// ```ignore
/// let rep = dapps::reputation::reference();
/// ```
#[proc_macro_attribute]
pub fn cdm(attr: TokenStream, item: TokenStream) -> TokenStream {
    let package_name = parse_macro_input!(attr as LitStr).value();
    let input = parse_macro_input!(item as ItemMod);

    // Find the storage struct name
    let storage_struct_name = match find_storage_struct(&input) {
        Some(name) => name,
        None => {
            return syn::Error::new_spanned(
                &input.ident,
                "CDM: Could not find #[ink(storage)] struct in module. \
                 Make sure the module contains a struct with the #[ink(storage)] attribute.",
            )
            .to_compile_error()
            .into();
        }
    };

    let module_name = &input.ident;
    let ref_type = format_ident!("{}Ref", storage_struct_name);

    // Generate the reference() function at crate level
    let generated: TokenStream2 = quote! {
        #input  // Pass through the original ink contract unchanged

        /// Get a runtime-resolved reference to this contract via CDM.
        ///
        /// This function looks up the contract address from the contracts registry
        /// at runtime, allowing for dynamic contract resolution.
        ///
        /// # Panics
        ///
        /// Panics if the contract is not registered in the contracts registry
        /// under the name "#package_name".
        pub fn reference() -> #module_name::#ref_type {
            use ink::env::call::FromAddr;
            use ink::prelude::string::String;

            let registry = contracts::reference();

            let addr = registry
                .get_address(String::from(#package_name))
                .expect("CDM: contract not found in registry");

            #module_name::#ref_type::from_addr(addr)
        }
    };

    generated.into()
}
