OUTPUT="address "0x291f4f5471385ed0a30757a7e69fdf2720d9effa" b"

echo $OUTPUT
echo $OUTPUT | grep address
CONTRACT=$(echo $OUTPUT | grep address | awk -F'"' '{print $2}')
echo Contract Adress $CONTRACT
