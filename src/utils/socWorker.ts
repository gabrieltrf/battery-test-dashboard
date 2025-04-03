self.onmessage = function (event) {
    const { data, nominalCapacity } = event.data;

    const calculateSOC = (dataPoint, allData) => {
        let ampHours = 0;
        const currentIndex = allData.findIndex(d => d.time === dataPoint.time);

        for (let i = 0; i < currentIndex; i++) {
            const point = allData[i];
            const nextPoint = allData[i + 1];
            if (nextPoint) {
                const timeDiff = (nextPoint.time - point.time) / 3600;
                const avgCurrent = (point.current + nextPoint.current) / 2;
                ampHours += avgCurrent * timeDiff;
            }
        }

        return Math.max(0, Math.min(100, 100 - (ampHours / nominalCapacity) * 100));
    };

    const results = data.map(item => ({
        ...item,
        soc: calculateSOC(item, data),
    }));

    postMessage(results);
};
