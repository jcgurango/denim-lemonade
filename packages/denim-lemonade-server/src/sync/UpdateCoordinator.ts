export type RetrieveCallbackRegistration = {
  bucket: string;
  callback: RetrieveCallback;
};
export type RetrieveCallback = (lastCheckTime: Date) => Promise<any[]>;
export type RetrieveTransformation = (data: any) => any[];
export type UpdateCallback = (record: any, lastCallbackData?: any) => any;

export interface UpdateCoordinatorPersistor {
  saveBuckets(buckets: { [key: string]: any[] }): Promise<void>;
  readBuckets(): Promise<{ [key: string]: any[] }>;
  saveLastCheck(lastCheck: number): Promise<void>;
  readLastCheck(): Promise<number | null>;
}

export default class UpdateCoordinator {
  retrieveCallbacks: RetrieveCallbackRegistration[];
  retrieveTransformations: RetrieveTransformation[][];
  updateCallbacks: { [key: string]: UpdateCallback[] };
  buckets: { [key: string]: any[] };
  persistor: UpdateCoordinatorPersistor;

  constructor(persistor: UpdateCoordinatorPersistor) {
    this.retrieveCallbacks = [];
    this.retrieveTransformations = [];
    this.buckets = {};
    this.updateCallbacks = {};
    this.persistor = persistor;
  }

  registerRetriever(
    bucket: string,
    callback: RetrieveCallback,
    ...transformations: RetrieveTransformation[]
  ) {
    this.retrieveCallbacks.push({
      bucket,
      callback,
    });
    this.retrieveTransformations.push(transformations);
  }

  unregisterRetriever(bucket: string, callback: RetrieveCallback) {
    const index = this.retrieveCallbacks.findIndex(
      ({ bucket: b, callback: c }) => b === bucket && c === callback,
    );

    if (index > -1) {
      this.retrieveCallbacks.splice(index, 1);
      this.retrieveTransformations.splice(index, 1);
    }
  }

  registerUpdater(bucket: string, ...callback: UpdateCallback[]) {
    if (!this.updateCallbacks[bucket]) {
      this.updateCallbacks[bucket] = [];
    }

    this.updateCallbacks[bucket].push(...callback);
  }

  poll(pollDelay: number) {
    let end = false;

    const run = async () => {
      while (!end) {
        const now = Date.now();
        let lastCheck = -1;

        const savedDate = await this.persistor.readLastCheck();

        if (savedDate) {
          lastCheck = savedDate;
        }

        this.buckets = await this.persistor.readBuckets();

        // Trigger all the callbacks and wait for them to complete.
        try {
          const lastCheckDate = new Date(lastCheck);

          if (this.retrieveCallbacks.length) {
            await Promise.all(
              this.retrieveCallbacks.map(async ({ bucket, callback }, c) => {
                try {
                  const transformation = this.retrieveTransformations[c];
                  let promise = callback(new Date(lastCheckDate));

                  for (let i = 0; i < transformation.length; i++) {
                    promise = promise.then(transformation[i]);
                  }

                  const result = await promise;

                  if (!this.buckets[bucket]) {
                    this.buckets[bucket] = [];
                  }

                  // Push data into the buckets.
                  this.buckets[bucket].push(...result);

                  // Deduplicate the bucket.
                  let newBucket: any[] = [];

                  for (let i = 0; i < this.buckets[bucket].length; i++) {
                    const record = this.buckets[bucket][i];
                    const existingIndex = newBucket.findIndex(({ id }) => record.id === id);

                    if (existingIndex > -1) {
                      newBucket.splice(existingIndex, 1);
                    }

                    newBucket.push(record);
                  }

                  this.buckets[bucket] = newBucket;
                } catch (e) {
                  console.log('Error retrieving for ' + bucket + ':');
                  console.error(e);
                }
              }),
            );
          }

          // Update the last check.
          await this.persistor.saveLastCheck(now);

          // Run updaters.
          await Promise.all(
            Object.keys(this.updateCallbacks).map(async (bucket) => {
              const updateCallbacks = this.updateCallbacks[bucket];
              const data = this.buckets[bucket];
              const success: any[] = [];

              for (let i = 0; i < data.length; i++) {
                const record = data[i];
                let last = record;

                try {
                  for (let c = 0; c < updateCallbacks.length; c++) {
                    last = await updateCallbacks[c](last, record);
                  }

                  success.push(record);
                } catch (e) {
                  console.log('Error updating for ' + bucket + ':');
                  console.error(e);
                  console.log('Record: ' + JSON.stringify(last, null, '  '));
                }
              }

              this.buckets[bucket] = [];
            }),
          );

          // Save the buckets for later processing.
          await this.persistor.saveBuckets(this.buckets);
        } catch (e) {
          console.error('Callback failure', e);
        }

        // Delay, if any.
        if (pollDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, pollDelay));
        }
      }
    };

    run();

    return () => {
      end = true;
    };
  }
}
