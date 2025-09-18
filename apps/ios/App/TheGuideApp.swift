//
//  TheGuideApp.swift
//  TheGuide
//
//  Created by M on 9/17/25.
//

import SwiftUI

@main
struct TheGuideApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
