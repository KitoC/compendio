import { BaseController } from "locals/controllers/_BaseController";
import { PublicContext } from "locals/middleware/withPublicContext";
import { AuthenticatedContext } from "locals/middleware/withAuthenticatedContext";
import { ICredential } from "locals/services/CredentialsService";
import { OAuthController } from "locals/controllers/OAuthController";
import { ConnectedService } from "locals/services/ConnectedServicesService";

class ConnectedServiceController extends BaseController {
  public connectedService: ConnectedService | null;

  constructor(
    public context: PublicContext | AuthenticatedContext,
    public oauthController: OAuthController
  ) {
    super();
    this.connectedService = null;
  }

  async getConnectedServiceAndRefreshToken(connected_service_id: string) {
    const { context, oauthController } = this;
    const connectedService =
      await context.connectedServicesService.getConnectedService(
        connected_service_id
      );

    this.connectedService = connectedService;

    const credential = await context.credentialsService.getCredential(
      connectedService.credential_id
    );

    const refreshCredentialResponse =
      await oauthController.refreshOauthCredential(credential);

    if (!refreshCredentialResponse) {
      this.throwError("Failed to refresh credential", 500);
      return;
    }

    const accessToken = refreshCredentialResponse.tokenData.access_token;

    return {
      accessToken,
      credential,
    };
  }
}

export { ConnectedServiceController };
