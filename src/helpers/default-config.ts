export type Config = {
  spans: Array<{
    interval: number;
    retention: number;
    os: Array<{
      memory: number;
      load: number;
      timestamp: number;
      heap: number;
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
