# 1. Setup keypair for deployment *or* we can just use alice
#    on paseo which seems to be pre-funded?

# 2. All project setup stuff to deploy 
#    contract via CI? Just automated deployment tbh.

pop up ./rep_system \
    --suri "//Alice" \
    --url wss://testnet-passet-hub.polkadot.io \
    --args "true" \
    -x -y