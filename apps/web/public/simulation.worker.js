// Simulation Web Worker
self.onmessage = async e => {
  const { decision, option, userProfile, config, id } = e.data

  try {
    // For now, we'll need to include the simulation engine in the build
    // This is a limitation of Web Workers - they can't import from node_modules
    // TODO: Bundle the simulation engine for web workers
    throw new Error('Web Worker bundling not yet configured')

    // The following code is temporarily unreachable but will be used once bundling is configured
    /*
    const engine = new AdvancedSimulationEngine(`worker-${Date.now()}`)

    const result = await engine.runAdvancedSimulation(
      decision,
      option,
      userProfile,
      config,
      progress => {
        self.postMessage({
          type: 'progress',
          id,
          progress,
        })
      }
    )

    self.postMessage({
      type: 'complete',
      id,
      result,
    })
    */
  } catch (error) {
    self.postMessage({
      type: 'error',
      id,
      error: error.message,
    })
  }
}
