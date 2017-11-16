const assert = require('assert');

const { drop, set } = require('../../app/storage.js');
const { ASPSP_AUTH_SERVERS_COLLECTION } = require('../../app/authorisation-servers/authorisation-servers');
const {
  allAuthorisationServers,
  storeAuthorisationServers,
  updateOpenIdConfigs,
  getClientCredentials,
  updateClientCredentials,
} = require('../../app/authorisation-servers');

const nock = require('nock');

const authServerId = 'aaaj4NmBD8lQxmLh2O9FLY';
const flattenedObDirectoryAuthServerList = [
  {
    Id: authServerId,
    BaseApiDNSUri: 'http://aaa.example.com',
    CustomerFriendlyName: 'AAA Example Bank',
    OpenIDConfigEndPointUri: 'http://example.com/openidconfig',
    OBOrganisationId: 'aaa-example-org',
  },
];

const openIdConfig = {
  authorization_endpoint: 'http://auth.example.com/authorize',
  token_endpoint: 'http://auth.example.com/token',
};

const clientCredentials = {
  clientId: 'a-client-id',
  clientSecret: 'a-client-secret',
};

const withOpenIdConfig = {
  id: authServerId,
  obDirectoryConfig: {
    BaseApiDNSUri: 'http://aaa.example.com',
    CustomerFriendlyName: 'AAA Example Bank',
    OpenIDConfigEndPointUri: 'http://example.com/openidconfig',
    Id: authServerId,
    OBOrganisationId: 'aaa-example-org',
  },
  openIdConfig,
};

const withClientCredsConfig = {
  id: authServerId,
  obDirectoryConfig: {
    BaseApiDNSUri: 'http://aaa.example.com',
    CustomerFriendlyName: 'AAA Example Bank',
    OpenIDConfigEndPointUri: 'http://example.com/openidconfig',
    Id: authServerId,
    OBOrganisationId: 'aaa-example-org',
  },
  clientCredentials,
};

describe('authorisation servers', () => {
  beforeEach(async () => {
    await drop(ASPSP_AUTH_SERVERS_COLLECTION);
    await storeAuthorisationServers(flattenedObDirectoryAuthServerList);
  });

  afterEach(async () => {
    await drop(ASPSP_AUTH_SERVERS_COLLECTION);
  });

  describe('getClientCredentials', () => {
    let authorisationServerId;
    beforeEach(async () => {
      const list = await allAuthorisationServers();
      const authServer = list[0];
      authorisationServerId = list[0].id;
      await set(
        ASPSP_AUTH_SERVERS_COLLECTION,
        Object.assign(authServer, { clientCredentials }),
        authorisationServerId,
      );
    });

    it('retrieves client credentials for an authorisationServerId', async () => {
      const found = await getClientCredentials(authorisationServerId);
      assert.deepEqual(found, clientCredentials);
    });
  });

  describe('updateClientCredentials', () => {
    it('before called clientCredentials not present', async () => {
      const list = await allAuthorisationServers();
      const authServerConfig = list[0];
      assert.ok(!authServerConfig.clientCredentials, 'clientCredentials not present');
    });

    it('stores clientCredential in db', async () => {
      await updateClientCredentials(authServerId, clientCredentials);
      const list = await allAuthorisationServers();
      const authServerConfig = list[0];
      assert.ok(authServerConfig.clientCredentials, 'clientCredentials present');
      assert.deepEqual(authServerConfig, withClientCredsConfig);
    });
  });

  describe('updateOpenIdConfigs', () => {
    nock(/example\.com/)
      .get('/openidconfig')
      .reply(200, openIdConfig);

    it('before called openIdConfig not present', async () => {
      const list = await allAuthorisationServers();
      const authServerConfig = list[0];
      assert.ok(!authServerConfig.openIdConfig, 'openIdConfig not present');
    });

    it('retrieves openIdConfig and stores in db', async () => {
      await updateOpenIdConfigs();
      const list = await allAuthorisationServers();
      const authServerConfig = list[0];
      assert.ok(authServerConfig.openIdConfig, 'openIdConfig present');
      assert.deepEqual(authServerConfig, withOpenIdConfig);
    });
  });
});
