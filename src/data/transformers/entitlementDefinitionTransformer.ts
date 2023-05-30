import { EntitlementDefinition as EntitlementDefinitionClient } from '../../entitlementsAdmin/entitlementsAdminClient'
import { EntitlementDefinition as EntitlementDefinitionGraphQL } from '../../gen/graphqlTypes'

export class EntitlementDefinitionTransformer {
  public static toClient(
    graphql: EntitlementDefinitionGraphQL,
  ): EntitlementDefinitionClient {
    return {
      name: graphql.name,
      description: graphql.description ?? undefined,
      type: graphql.type,
      expendable: graphql.expendable,
    }
  }
  public static toGraphQL(
    client: EntitlementDefinitionClient,
  ): EntitlementDefinitionGraphQL {
    return {
      name: client.name,
      description: client.description,
      type: client.type,
      expendable: client.expendable,
    }
  }
}
