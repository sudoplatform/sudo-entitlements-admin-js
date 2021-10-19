import { EntitlementsSequence } from '../../entitlementsAdmin/entitlementsAdminClient'
import { EntitlementsSequence as EntitlementsSequenceGraphQL } from '../../gen/graphqlTypes'
import { EntitlementsSequenceTransitionTransformer } from './entitlementsSequenceTransitionTransformer'

export class EntitlementsSequenceTransformer {
  public static toClient(
    graphql: EntitlementsSequenceGraphQL,
  ): EntitlementsSequence {
    return {
      createdAt: new Date(graphql.createdAtEpochMs),
      updatedAt: new Date(graphql.updatedAtEpochMs),
      version: graphql.version,
      name: graphql.name,
      description: graphql.description ?? undefined,
      transitions: graphql.transitions.map(
        EntitlementsSequenceTransitionTransformer.toClient,
      ),
    }
  }

  public static toGraphQL(
    client: EntitlementsSequence,
  ): EntitlementsSequenceGraphQL {
    return {
      createdAtEpochMs: client.createdAt.getTime(),
      updatedAtEpochMs: client.updatedAt.getTime(),
      version: client.version,
      name: client.name,
      description: client.description,
      transitions: client.transitions.map(
        EntitlementsSequenceTransitionTransformer.toGraphQL,
      ),
    }
  }
}
