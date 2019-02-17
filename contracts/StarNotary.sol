pragma solidity >=0.5.0;

//Importing openzeppelin-solidity ERC-721 implemented Standard
import "../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";

// StarNotary Contract declaration inheritance the ERC721 openzeppelin implementation
contract StarNotary is ERC721 {
    string public name;
    string public symbol;

    // Star data
    struct Star {
        string name;
    }

    // mapping the Star with the Owner Address
    mapping(uint256 => Star) public tokenIdToStarInfo;
    // mapping the TokenId and price
    mapping(uint256 => uint256) public starsForSale;
    mapping(uint256 => uint256) public starExchange;

    constructor (string memory _name, string memory _symbol) public {
        name = _name;
        symbol = _symbol;
    }

    event starExchangeOffer(uint256 indexed ownedToken, uint256 indexed desiredToken);
    event starExchangeDeal(uint256 indexed token1, uint256 indexed token2);
    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Utility functio that resets a star state
     * @param _tokenId {uint256} Star token
     */
    function resetStarState(uint256 _tokenId) internal {
        delete starsForSale[_tokenId];
        delete starExchange[_tokenId];
    }

    /**
     * @dev Converts an {address} into a {payable address}
     *      https://solidity.readthedocs.io/en/latest/types.html#address
     * @param x {address} The address to convert
     * @return The equivalent payable address
     */
    function _make_payable(address x) internal pure returns (address payable) {
        return address(uint160(x));
    }

    /********************************************************************************************/
    /*                                       CONTRACT FUNCTIONS                                 */
    /********************************************************************************************/

    /**
     * @dev Create and mint a star token.
     * @param _tokenId {uint256} Star token ID
     * @param _name {string} Star token name
     */
    function createStar(string memory _name, uint256 _tokenId) public {
        require(!_exists(_tokenId), 'Token id already taken');
        Star memory newStar = Star(_name);

        tokenIdToStarInfo[_tokenId] = newStar;
        // _mint assign the the star with _tokenId to the sender address (ownership)
        _mint(msg.sender, _tokenId);
    }

    /**
     * @dev Put a star token for sale.
     * @param _tokenId {uint256} Star token ID
     * @param _price {uint256} Sale price
     */
    function putStarUpForSale(uint256 _tokenId, uint256 _price) public {
        require(ownerOf(_tokenId) == msg.sender, "UNAUTHORIZED: You can't sell a star you don't own");

        starsForSale[_tokenId] = _price;
    }

    /**
     * @dev Transfer a token to message sender if he sent enough funds.
     * @param _tokenId {uint256} Star token ID
     */
    function buyStar(uint256 _tokenId) public  payable {
        uint256 starCost = starsForSale[_tokenId];

        require(starCost > 0, "UNAUTHORIZED: Star not for sale");
        require(msg.value > starCost, "UNAUTHORIZED: Not enough ether");

        address ownerAddress = ownerOf(_tokenId);

        resetStarState(_tokenId);

        _transferFrom(ownerAddress, msg.sender, _tokenId);

        // We need to make this conversion to be able to use transfer() function to transfer ethers
        address payable ownerAddressPayable = _make_payable(ownerAddress);
        ownerAddressPayable.transfer(starCost);

        // Send back the rest to the new buyer
        if(msg.value > starCost) {
            msg.sender.transfer(msg.value - starCost);
        }
    }

    /**
     * @param _tokenId {uint256} Star token ID
     * @return Star name
     */
    function lookUptokenIdToStarInfo (uint _tokenId) public view returns (string memory) {
        return tokenIdToStarInfo[_tokenId].name;
    }

    /**
     * @dev Star owner can approve the contract to trade his star for another star.
     * @param ownedToken {uint256} Star to trade
     * @param otherToken {uint256} Star to be received
     */
    function approveForExchange(uint256 ownedToken, uint256 otherToken) public {
        require(ownerOf(ownedToken) == msg.sender, 'UNAUTHORIZED: Not star owner');
        require(_exists(otherToken), 'Desired token not found');

        starExchange[ownedToken] = otherToken;
        emit starExchangeOffer(ownedToken, otherToken);
    }

    /**
     * @dev Initiate the star tokens exchange, both owners need to approve the exchange beforehand.
     * @param _tokenId1 {uint256} Star to trade
     * @param _tokenId2 {uint256} Star to trade
     */
    function exchangeStars(uint256 _tokenId1, uint256 _tokenId2) public {
        require(
            (starExchange[_tokenId1] == _tokenId2) &&
            (starExchange[_tokenId2] == _tokenId1),
            'Exchange not approved by both token owners'
        );

        // Finally transfer the stars
        address token1Owner = ownerOf(_tokenId1);
        address token2Owner = ownerOf(_tokenId2);

        // Reset star state
        resetStarState(_tokenId1);
        resetStarState(_tokenId2);

        _transferFrom(token1Owner, token2Owner, _tokenId1);
        _transferFrom(token2Owner, token1Owner, _tokenId2);

        emit starExchangeDeal(_tokenId1, _tokenId2);
    }

    /**
     * @dev Star token owner can transfer his token to another address
     * @param _to {address} Receiver address
     * @param _tokenId {uint256} Star token to transfer
     */
    function transferStar(address _to, uint256 _tokenId) public {
        // I need to make the ownership checks so that i can call `resetState` before `transferFrom`
        require(ownerOf(_tokenId) == msg.sender, 'UNAUTHORIZED: Not star owner');

        resetStarState(_tokenId);

        transferFrom(msg.sender, _to, _tokenId);
    }
}