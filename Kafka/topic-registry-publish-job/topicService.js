const { Kafka } = require('kafkajs');


async function createTopics(kafkaBrokerUri, allTopics) {

    const kafkaClient = new Kafka({
        clientId: 'routing-guide-kafka-deployment-process',
        brokers: [kafkaBrokerUri]
    });
    const adminKafkaClient = kafkaClient.admin();

    await adminKafkaClient.connect();

    //Print out all topics
    console.log(`\nAll Routing Guide Topics:`);
    for(let i = 0; i < allTopics.length; i++){ 
        console.log(`${allTopics[i]}\n`);
    }

    //Print out existing topics
    let existingTopics = await adminKafkaClient.listTopics();
    let existingRoutingGuideTopics = existingTopics.filter(_ => _.startsWith("routingguide."));
    console.log(`Routing Guide Topics Already Created:`);
    if(existingRoutingGuideTopics.length == 0){
        console.log("None\n");
    }
    else{
        for(let i = 0; i < existingRoutingGuideTopics.length; i++){ 
            console.log(`${existingRoutingGuideTopics[i]}\n`);
        }
    }
        
    //Print out new topics being created
    let missingTopics = allTopics.filter(d => !existingRoutingGuideTopics.includes(d));
    console.log(`Routing Guide Topics Not Yet Created:`);
    if(missingTopics.length == 0){
        console.log("None\n");
    }
    else{
        for(let i = 0; i < missingTopics.length; i++){ 
            console.log(`${missingTopics[i]}\n`);
        }
    }
    
    //Create missing topics
    for(let i = 0; i < missingTopics.length; i++){ 
        console.log(`Creating topic: ${missingTopics[i]}`);
        try {
            let result = await adminKafkaClient.createTopics({
                topics:[
                    {
                        topic: missingTopics[i],
                        numPartitions: 8,
                        replicationFactor: 2
                    }
                ]
            });
    
            if(result){
                console.log(`${missingTopics[i]} was created successfully!`);
            }

        } catch (error) {
            console.log(`An error occurred when creating ${missingTopics[i]} topic. Error details:\n ${error}`);
        }
        
    }

    await adminKafkaClient.disconnect();

}

module.exports = {
    createTopics: createTopics
}