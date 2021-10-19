import { EntitlementsSequenceTransition } from '../../entitlementsAdmin/entitlementsAdminClient'
import { EntitlementsSequenceTransition as EntitlementsSequenceTransitionGraphQL } from '../../gen/graphqlTypes'

export class EntitlementsSequenceTransitionTransformer {
  public static toClient(
    graphql: EntitlementsSequenceTransitionGraphQL,
  ): EntitlementsSequenceTransition {
    return {
      entitlementsSetName: graphql.entitlementsSetName,
      duration: graphql.duration ?? undefined,
    }
  }

  public static toGraphQL(
    client: EntitlementsSequenceTransition,
  ): EntitlementsSequenceTransitionGraphQL {
    return {
      entitlementsSetName: client.entitlementsSetName,
      duration: client.duration,
    }
  }
}
