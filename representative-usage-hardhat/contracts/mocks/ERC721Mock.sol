pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';

contract ERC721Mock is ERC721 {
    constructor()ERC721("Mock", "M"){
        _mint(msg.sender, 1);
    }

    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}