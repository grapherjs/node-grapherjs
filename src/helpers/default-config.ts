export type Config = {
  spans: Array<{
    interval: number;
    retention: number;
    os: Array<{
      memory: number;
      load: number[];
      timestamp: number;
      heap: {
        does_zap_garbage: number;
        heap_size_limit: number;
        malloced_memory: number;
        number_of_detached_contexts: number;
        number_of_native_contexts: number;
        peak_malloced_memory: number;
        total_available_size: number;
        total_heap_size: number;
        total_heap_size_executable: number;
        total_physical_size: number;
        used_heap_size: number;
      };
      loop: number;
    }>;
    responses: Array<{
      timestamp: number;
      count: number;
      mean: number;
      2: number;
      3: number;
      4: number;
      5: number;
    }>;
  }>;
};

const defaultConifg: Config = {
  spans: [
    {
      interval: 1,
      retention: 60,
      os: [],
      responses: [],
    },
    {
      interval: 5,
      retention: 60,
      os: [],
      responses: [],
    },
    {
      interval: 15,
      retention: 60,
      os: [],
      responses: [],
    },
  ],
};

export default defaultConifg;
