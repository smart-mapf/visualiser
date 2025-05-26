import { Components, createPlugin, useInputContext } from "leva/plugin";
import { useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useCss } from "react-use";
type V = File | null;

type S = {
  accept?: Record<string, string[]>;
  disabled?: boolean;
  defaultValue?: V;
  onAccept?: (f: File | null) => void;
};

const FilePicker = () => {
  const { label, settings } = useInputContext<{
    value?: V;
    settings: S;
  }>();
  const { acceptedFiles, getRootProps, getInputProps, isDragActive } =
    useDropzone({
      multiple: false,
      accept: settings.accept,
    });

  const file = acceptedFiles[0];

  useEffect(() => {
    if (file) {
      const file = acceptedFiles[0];
      settings.onAccept?.(file);
    }
  }, [file]);

  const cls = useCss({
    backgroundColor: "var(--leva-colors-elevation3)",
    color: "var(--leva-colors-text)",
    fontWeight: 400,
    borderRadius: "var(--leva-radii-sm)",
    "&:hover": {
      borderColor: "var(--leva-colors-accent2)",
    },
  });

  return (
    <Components.Row input>
      <Components.Label>{label}</Components.Label>
      <button {...getRootProps({ className: cls })}>
        <input {...getInputProps()} />
        {settings.defaultValue
          ? settings.defaultValue.name
          : isDragActive
          ? "Drop file here"
          : "Click to select file"}
      </button>
    </Components.Row>
  );
};

export const file = createPlugin({
  normalize: ({
    value,
    ...props
  }: {
    value?: V;
  } & S) => ({ value, settings: props }),
  component: FilePicker,
});
