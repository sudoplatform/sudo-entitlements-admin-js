import { EntitlementsSequencesConnection } from '../../entitlementsAdmin/entitlementsAdminClient'
import { EntitlementsSequencesConnection as EntitlementsSequencesConnectionGraphQL } from '../../gen/graphqlTypes'
import { EntitlementsSequenceTransformer } from './entitlementsSequenceTransformer'

export class EntitlementsSequencesConnectionTransformer {
  public static toClient(
    graphql: EntitlementsSequencesConnectionGraphQL,
  ): EntitlementsSequencesConnection {
    return {
      items: graphql.items.map(EntitlementsSequenceTransformer.toClient),
      nextToken: graphql.nextToken ?? undefined,
    }
  }
}
