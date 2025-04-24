import React, { useMemo, useState } from "react";
import Timeline, { DateHeader, TimelineHeaders } from "react-calendar-timeline";
import moment from "moment";
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
} from "date-fns";
import "react-calendar-timeline/style.css";

type ViewScale = "day" | "week" | "month" | "year";

const getTimeRange = (view: ViewScale): [number, number] => {
  const now = new Date();
  switch (view) {
    case "day":
      return [startOfDay(now).getTime(), addDays(startOfDay(now), 1).getTime()];
    case "week":
      return [
        startOfWeek(now, { weekStartsOn: 1 }).getTime(),
        addWeeks(startOfWeek(now, { weekStartsOn: 1 }), 1).getTime(),
      ];
    case "month":
      return [
        startOfMonth(now).getTime(),
        addMonths(startOfMonth(now), 1).getTime(),
      ];
    case "year":
      return [
        startOfYear(now).getTime(),
        addYears(startOfYear(now), 1).getTime(),
      ];
    default:
      return [now.getTime(), now.getTime()];
  }
};

const ControlledTimeline: React.FC = () => {
  const [view, setView] = useState<ViewScale>("day");
  const [visibleTimeRange, setVisibleTimeRange] = useState(() =>
    getTimeRange("day")
  );

  const groups = useMemo(
    () => [
      { id: 1, title: "Group A" },
      { id: 2, title: "Group B" },
    ],
    []
  );

  const items = useMemo(
    () => [
      {
        id: 1,
        group: 1,
        title: "Item 1",
        start_time: moment().add(-0.5, "day"),
        end_time: moment().add(0.5, "day"),
      },
      {
        id: 2,
        group: 2,
        title: "Item 2",
        start_time: moment().add(1, "day"),
        end_time: moment().add(2, "day"),
      },
    ],
    []
  );

  const handleViewChange = (newView: ViewScale) => {
    setView(newView);
    setVisibleTimeRange(getTimeRange(newView));
  };

  return (
    <div className="p-4">
      <label className="mr-2 font-medium">Select View:</label>
      <select
        value={view}
        onChange={(e) => handleViewChange(e.target.value as ViewScale)}
        className="border p-1 rounded"
      >
        <option value="day">Day</option>
        <option value="week">Week</option>
        <option value="month">Month</option>
        <option value="year">Year</option>
      </select>

      <div className="mt-4">
        <Timeline
          groups={groups}
          items={items}
          defaultTimeStart={moment(visibleTimeRange[0]).valueOf()}
          defaultTimeEnd={moment(visibleTimeRange[1]).valueOf()}
          visibleTimeStart={visibleTimeRange[0]}
          visibleTimeEnd={visibleTimeRange[1]}
          onTimeChange={(start, end) => setVisibleTimeRange([start, end])}
        >
          <TimelineHeaders>
            <DateHeader unit="primaryHeader" />
            {view === "day" ? (
              <DateHeader
                unit="hour"
                labelFormat={([time]) => {
                  console.log("time", time);
                  return time.format("h a");
                }}
              />
            ) : (
              <DateHeader />
            )}
          </TimelineHeaders>
        </Timeline>
      </div>
    </div>
  );
};

export default ControlledTimeline;
