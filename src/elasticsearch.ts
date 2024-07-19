import { Client } from '@elastic/elasticsearch'
import { ISellerGig, winstonLogger } from '@harshbhama/jobber-shared';
import { config } from "@auth/config"
import { Logger, error } from 'winston';
import { ClusterHealthResponse, GetResponse } from '@elastic/elasticsearch/lib/api/types'

const log:Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authElasticSearchServer', 'debug');


 const elasticSearchClient = new Client({
  node:`${config.ELASTIC_SEARCH_URL}`
})

 async function checkConnection(): Promise<void> {
  let isConnected = false;
  while(!isConnected){
    log.info('AuthService connecting to ElasticSearch...');
    try{
      const health: ClusterHealthResponse = await elasticSearchClient.cluster.health({});
      log.info(`AuthService service ElasticSearch health status - ${health.status}`)
      isConnected = true;
    }catch(err){
      console.log("Config environment variables", config.ELASTIC_SEARCH_URL)
      console.log("Config", config);
      log.error('Connection to Elastic Search failed. Retying...')
      log.log('error', 'NotificationService checkConnection() method:', error)
    }
  }
}

async function checkIFIndexExist(indexName: string): Promise<boolean> {
  const result: boolean = await elasticSearchClient.indices.exists({index: indexName});
  return result;
}

async function createIndex(indexName: string): Promise<void> {
  try{
    const result: boolean = await checkIFIndexExist(indexName);
    if(result){
      log.info(`Index ${indexName} already exisits`);
    }else{
      await elasticSearchClient.indices.create({index: indexName});
      await elasticSearchClient.indices.refresh({index: indexName}); // avaialve for search
      log.info(`Created index ${indexName}`);
    }

  }catch(error){
    log.error(`An error occurred while creating the index ${indexName}`)
    log.log('error', 'NotificationService createIndex() method:', error)
  }
}

async function getDocuemntById(index: string, gigId: string): Promise<ISellerGig>{
  try {
    const result: GetResponse = await elasticSearchClient.get({
      index,
      id: gigId,
    })
    return result._source as ISellerGig;
  } catch (error) {
    log.log('error', 'NotificationService getDocuemntById() method:', error)
    return {} as ISellerGig;
  }
}

export { elasticSearchClient, checkConnection, createIndex, getDocuemntById };