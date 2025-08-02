// Cadence scripts for querying NFL All Day data

export const GET_NFL_MOMENTS = `
import AllDay from 0xe4cf4bdc1751c65d
import NonFungibleToken from 0x1d7e57aa55817448

access(all) fun main(address: Address): [UInt64] {
    let account = getAccount(address)
    
    let collectionRef = account.capabilities
        .get<&{AllDay.MomentNFTCollectionPublic}>(AllDay.CollectionPublicPath)
        .borrow()
    
    if collectionRef == nil {
        return []
    }
    
    return collectionRef!.getIDs()
}
`;

export const GET_MOMENT_METADATA = `
import AllDay from 0xe4cf4bdc1751c65d

access(all) struct MomentData {
    access(all) let id: UInt64
    access(all) let playID: UInt64
    access(all) let serialNumber: UInt64
    access(all) let mintingDate: UFix64?
    
    init(
        id: UInt64,
        playID: UInt64,
        serialNumber: UInt64,
        mintingDate: UFix64?
    ) {
        self.id = id
        self.playID = playID
        self.serialNumber = serialNumber
        self.mintingDate = mintingDate
    }
}

access(all) fun main(address: Address, id: UInt64): MomentData? {
    let account = getAccount(address)
    
    let collectionRef = account.capabilities
        .get<&{AllDay.MomentNFTCollectionPublic}>(AllDay.CollectionPublicPath)
        .borrow()
    
    if collectionRef == nil {
        return nil
    }
    
    let nft = collectionRef!.borrowMomentNFT(id: id)
    if nft == nil {
        return nil
    }
    
    return MomentData(
        id: nft!.id,
        playID: nft!.data.playID,
        serialNumber: nft!.data.serialNumber,
        mintingDate: nft!.data.mintingDate
    )
}
`;