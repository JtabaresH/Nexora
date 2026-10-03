import { AssetProvider } from "./types";
import { MockAssetProvider } from "./mock-asset-provider";
import { OnChainAssetProvider } from "./onchain-asset-provider";

export class AssetService {
  private static mockProvider = new MockAssetProvider();
  private static onChainProvider = new OnChainAssetProvider();

  static getProvider(isDemoMode: boolean): AssetProvider {
    return isDemoMode ? this.mockProvider : this.onChainProvider;
  }
}
