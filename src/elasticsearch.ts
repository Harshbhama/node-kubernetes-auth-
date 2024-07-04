import { Client } from '@elastic/elasticsearch'
import { winstonLogger } from '@harshbhama/jobber-shared';
import { config } from "@auth/config"
import { Logger, error } from 'winston';
import { ClusterHealthResponse } from '@elastic/elasticsearch/lib/api/types'

const log:Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authElasticSearchServer', 'debug');


export const elasticSearchClient = new Client({
  node:`${config.ELASTIC_SEARCH_URL}`
})

export async function checkConnection(): Promise<void> {
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