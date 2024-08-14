// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.7.0) (proxy/ERC1967/ERC1967Proxy.sol)

pragma solidity ^0.8.0;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @dev This contract implements an upgradeable proxy. It is upgradeable because calls are delegated to an
 * implementation address that can be changed. This address is stored in storage slot `1` using the
 * {ERC1967Storage} layout.
 *
 * Upgradeability is only provided internally and can be set up by defining a {_authorizeUpgrade} internal function in the
 * implementation contract. See {UUPSUpgradeable} for an example of how to set up your contracts to use this upgrade
 * mechanism.
 */

contract ERC1967ProxyRun is ERC1967Proxy {
    constructor(address _logic, bytes memory _data) ERC1967Proxy(_logic, _data) {}
}