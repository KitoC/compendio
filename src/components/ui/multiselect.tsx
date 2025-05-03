import { ChevronDown, GripVertical } from "lucide-react";
import { Badge } from "./badge";

import React, { MouseEventHandler, useCallback, useMemo } from "react";

import Select, {
  components,
  MultiValueGenericProps,
  MultiValueProps,
  Props,
} from "react-select";
import {
  SortableContainer,
  SortableContainerProps,
  SortableElement,
  SortEndHandler,
  SortableHandle,
} from "react-sortable-hoc";

function arrayMove<T>(array: readonly T[], from: number, to: number) {
  const slicedArray = array.slice();
  slicedArray.splice(
    to < 0 ? array.length + to : to,
    0,
    slicedArray.splice(from, 1)[0]
  );
  return slicedArray;
}

const SortableMultiValue = SortableElement(
  (props: MultiValueProps<MultiselectOption>) => {
    // this prevents the menu from being opened/closed when the user clicks
    // on a value to begin dragging it. ideally, detecting a click (instead of
    // a drag) would still focus the control and toggle the menu, but that
    // requires some magic with refs that are out of scope for this example
    const onMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const innerProps = { ...props.innerProps, onMouseDown };

    return <components.MultiValue {...props} innerProps={innerProps} />;
  }
);

const SortHandle = SortableHandle((props: MultiValueGenericProps) => (
  <span className="flex items-center gap-2 cursor-move">
    <GripVertical className="w-4 h-4" />
    {props.children}
  </span>
));

const SortableSelect = SortableContainer(Select) as React.ComponentClass<
  Props<MultiselectOption, true> & SortableContainerProps
>;

export interface MultiselectOption {
  value: string;
  label: string;
  data?: unknown;
}

interface MultiselectProps extends Props<MultiselectOption> {
  value: MultiselectOption[];
  onChange: (value: MultiselectOption[]) => void;
  options: MultiselectOption[];
  disabled?: boolean;
  name: string;
  isClearable?: boolean;
  sortable?: boolean;
}

const defaultComponents = {
  MultiValueContainer: ({ children }) => (
    <Badge
      variant="outline"
      className="mr-1 bg-sidebar dark:bg-sidebar dark:[&>*]:!text-white"
    >
      <SortHandle />
      {children}
    </Badge>
  ),
  DropdownIndicator: () => (
    <div className="flex items-center justify-center p-2">
      <ChevronDown className="w-4 h-4" />
    </div>
  ),
};

const defaultStyles = {
  multiValueRemove: (base) => ({
    ...base,
    borderRadius: "50%",
    padding: "2px",
    height: "100%",
    marginLeft: "4px",
  }),
};

const Multiselect = ({
  value,
  onChange,
  options,
  disabled,
  name,
  isClearable,
  components,
  styles,
  sortable,
}: MultiselectProps) => {
  const onSortEnd: SortEndHandler = useCallback(
    ({ oldIndex, newIndex }) => {
      const newValue = arrayMove(value, oldIndex, newIndex);
      onChange(newValue);
    },
    [onChange, value]
  );

  const classNames = useMemo(() => {
    return {
      control: (state) =>
        "bg-background dark:bg-background border border-input !rounded-md overflow-hidden",
      multiValue: (state) => "!dark:bg-sidebar dark:text-white",
      menu: (state) => "dark:bg-sidebar dark:text-white",
      option: (state) => "dark:bg-sidebar hover:!bg-muted dark:text-white",
      container: () => "w-full",
    };
  }, []);

  if (sortable) {
    return (
      <SortableSelect
        useDragHandle
        helperClass="z-[999]"
        // react-sortable-hoc props:
        axis="xy"
        onSortEnd={onSortEnd}
        distance={4}
        // small fix for https://github.com/clauderic/react-sortable-hoc/pull/352:
        getHelperDimensions={({ node }) => node.getBoundingClientRect()}
        // react-select props:
        isMulti
        options={options}
        value={value}
        onChange={onChange}
        components={{
          ...defaultComponents,
          ...components,
          // @ts-expect-error We're failing to provide a required index prop to SortableElement
          MultiValue: SortableMultiValue,
        }}
        classNames={classNames}
        closeMenuOnSelect={false}
      />
    );
  }

  return (
    <Select
      value={value}
      isMulti
      name={name}
      isDisabled={disabled}
      options={options}
      onChange={onChange}
      isClearable={isClearable}
      classNamePrefix="select"
      menuPlacement="auto"
      classNames={classNames}
      styles={{
        ...defaultStyles,
        ...styles,
      }}
      components={{
        ...defaultComponents,
        ...components,
      }}
    />
  );
};

export default Multiselect;
