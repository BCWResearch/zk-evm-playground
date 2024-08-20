// Copyright (c) Immutable Pty Ltd 2018 - 2023
// SPDX-License-Identifier: Apache-2
// solhint-disable compiler-version
pragma solidity ^0.8.17;

import {AccessControlledDeployer} from "../../deployer/AccessControlledDeployer.sol";
import {OwnableCreate3Deployer} from "../../deployer/create3/OwnableCreate3Deployer.sol";

contract SeaportDeployer {
    address public admin;
    address public deployer;
    address public create3Deployer;
    address public seaportConduitController;
    address public accessControlledDeployer;

    bytes public constant WALLET_DEPLOY_CODE =
        hex"6054600f3d396034805130553df3fe63906111273d3560e01c14602b57363d3d373d3d3d3d369030545af43d82803e156027573d90f35b3d90fd5b30543d5260203df3";

    constructor(
        address _admin,
        address _create3Deployer,
        address _seaportConduitController,
        address _accessControlledDeployer
    ) {
        admin = _admin;
        create3Deployer = _create3Deployer;
        seaportConduitController = _seaportConduitController;
        accessControlledDeployer = _accessControlledDeployer;
    }

    function deployByCreate3() external returns (address) {
        bytes memory init = abi.encodePacked(
            WALLET_DEPLOY_CODE,
            seaportConduitController,
            admin
        );
        // convert to delegate call for deploy
        address seaport = AccessControlledDeployer(accessControlledDeployer)
            .deploy(OwnableCreate3Deployer(create3Deployer), init, bytes32(0));

        return seaport;
    }
}
