// Azure Static Web App for Rock Driller.
// The game is fully client-side, so the Free tier is enough to start.
//
//   az group create -n rg-rock-driller -l eastus2
//   az deployment group create -g rg-rock-driller -f infra/main.bicep
//
@description('Name of the Static Web App (becomes part of the default *.azurestaticapps.net URL).')
param name string = 'rock-driller'

@description('Static Web Apps is available in a limited set of regions.')
@allowed(['eastus2', 'centralus', 'westus2', 'westeurope', 'eastasia'])
param location string = 'eastus2'

@allowed(['Free', 'Standard'])
param sku string = 'Free'

resource swa 'Microsoft.Web/staticSites@2023-01-01' = {
  name: name
  location: location
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    // Deployments come from the GitHub Actions workflow using the API token,
    // so no repository link is configured here.
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
  }
}

output defaultHostname string = swa.properties.defaultHostname
output gameUrl string = 'https://${swa.properties.defaultHostname}/'
