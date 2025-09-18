// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "NetworkingKit",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "NetworkingKit",
            targets: ["NetworkingKit"]
        ),
    ],
    dependencies: [
        .package(path: "../CoreKit")
    ],
    targets: [
        .target(
            name: "NetworkingKit",
            dependencies: ["CoreKit"]
        ),
        .testTarget(
            name: "NetworkingKitTests",
            dependencies: ["NetworkingKit"]
        ),
    ]
)