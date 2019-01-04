END=5
for i in $(seq 1 $END); do
  node benchmark.js $TOTAL_TX | gnomon | grep Total | awk {'print $2'} >> $TOTAL_TX-$TOTAL_NODES.txt
done
