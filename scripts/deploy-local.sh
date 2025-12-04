
ENDPOINT=ws://127.0.0.1:9944

OUTPUT=$(pop up ../rep_system \
    --suri "//Alice" \
    --url $ENDPOINT \
    -x -y \
    | tee)
#echo $OUTPUT
CONTRACT=$(echo $OUTPUT | grep address | awk -F' ' '{print $6}') #TODO not working
echo Contract Adress $CONTRACT
echo Deploying Mark3t Rep
pop up ../mark3t_rep \
    --suri "//Alice" \
    --url $ENDPOINT \
    --args $CONTRACT \
    -x -y 
