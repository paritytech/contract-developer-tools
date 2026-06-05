# DotnsProtocolRegistry

dotNS protocol registry used by deployed contracts as the runtime address book for protocol components.

It stores named component addresses such as registrar, registry, resolvers, controllers, StoreFactory, and Multicall3. Other dotNS contracts resolve siblings through this registry instead of hardcoding addresses.
