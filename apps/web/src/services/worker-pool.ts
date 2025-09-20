/**
 * Web Worker Pool for running simulations without blocking the UI
 */

export interface WorkerTask {
  id: string
  decision: any
  option: any
  userProfile: any
  config: any
}

export interface WorkerMessage {
  type: 'progress' | 'complete' | 'error'
  id: string
  progress?: number
  result?: any
  error?: string
}

export class SimulationWorkerPool {
  private workers: Worker[] = []
  private availableWorkers: Worker[] = []
  private taskQueue: WorkerTask[] = []
  private activeJobs = new Map<
    string,
    {
      worker: Worker
      onProgress?: (progress: number) => void
      resolve: (result: any) => void
      reject: (error: Error) => void
    }
  >()

  constructor(private poolSize = navigator.hardwareConcurrency || 4) {
    this.initializePool()
  }

  private initializePool() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker('/simulation.worker.js')

      worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
        const { type, id, progress, result, error } = e.data
        const job = this.activeJobs.get(id)

        if (!job) return

        switch (type) {
          case 'progress':
            if (progress !== undefined) {
              job.onProgress?.(progress)
            }
            break

          case 'complete':
            job.resolve(result)
            this.completeJob(id, job.worker)
            break

          case 'error':
            job.reject(new Error(error || 'Unknown error'))
            this.completeJob(id, job.worker)
            break
        }
      }

      worker.onerror = error => {
        console.error('Worker error:', error)
        // Find and reject any active job on this worker
        for (const [id, job] of this.activeJobs.entries()) {
          if (job.worker === worker) {
            job.reject(new Error('Worker crashed'))
            this.activeJobs.delete(id)
          }
        }
        // Replace the crashed worker
        this.replaceWorker(worker)
      }

      this.workers.push(worker)
      this.availableWorkers.push(worker)
    }
  }

  private replaceWorker(oldWorker: Worker) {
    const index = this.workers.indexOf(oldWorker)
    if (index !== -1) {
      oldWorker.terminate()
      const newWorker = new Worker('/simulation.worker.js')
      this.workers[index] = newWorker

      // If the old worker was available, make the new one available
      const availIndex = this.availableWorkers.indexOf(oldWorker)
      if (availIndex !== -1) {
        this.availableWorkers[availIndex] = newWorker
      }
    }
  }

  private completeJob(id: string, worker: Worker) {
    this.activeJobs.delete(id)
    this.availableWorkers.push(worker)
    this.processQueue()
  }

  private processQueue() {
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const task = this.taskQueue.shift()!
      const worker = this.availableWorkers.shift()!

      // Send task to worker
      worker.postMessage(task)
    }
  }

  async runSimulation(
    decision: any,
    option: any,
    userProfile: any,
    config: any,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    const id = `sim-${Date.now()}-${Math.random()}`

    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        id,
        decision,
        option,
        userProfile,
        config,
      }

      if (this.availableWorkers.length > 0) {
        const worker = this.availableWorkers.shift()!
        this.activeJobs.set(id, { worker, onProgress, resolve, reject })
        worker.postMessage(task)
      } else {
        // Queue the task
        this.taskQueue.push(task)
        this.activeJobs.set(id, {
          worker: null as any, // Will be assigned when worker is available
          onProgress,
          resolve,
          reject,
        })
      }
    })
  }

  getStats() {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      activeJobs: this.activeJobs.size,
      queuedTasks: this.taskQueue.length,
    }
  }

  terminate() {
    this.workers.forEach(worker => worker.terminate())
    this.workers = []
    this.availableWorkers = []
    this.taskQueue = []
    this.activeJobs.clear()
  }
}

// Export singleton instance
export const simulationWorkerPool = new SimulationWorkerPool()
