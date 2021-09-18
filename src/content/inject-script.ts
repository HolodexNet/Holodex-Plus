interface ResultDetail {
  error?: any;
  ok?: boolean;
  data: string;
}

let serial = 0;

export function injectScript<TArg, TResult>(
  func: (args: TArg) => TResult | Promise<TResult>,
  args?: TArg
): Promise<TResult> {
  if (typeof func != "function") throw new TypeError("func is not a function");

  const id = "__injectScript__" + (Math.random() + serial++);
  const jsonArgs = JSON.stringify(args ?? null);

  const wrapperFunction = function (
    id: string,
    invoke: typeof func,
    args: TArg
  ) {
    function onSuccess(result: TResult) {
      const event = new CustomEvent<ResultDetail>(id, {
        detail: {
          ok: true,
          data: JSON.stringify(result ?? null),
        },
      });
      return document.dispatchEvent(event);
    }

    function onError(err: any) {
      const event = new CustomEvent<ResultDetail>(id, {
        detail: {
          error: err.toString(),
          data: "null",
        },
      });
      return document.dispatchEvent(event);
    }

    try {
      const result = invoke(args);
      if (typeof result == "object" && result instanceof Promise) {
        result.then((r) => onSuccess(r)).catch((err) => onError(err));
      } else {
        onSuccess(result);
      }
    } catch (err) {
      onError(err);
    }
  };

  const scriptText =
    "(" + wrapperFunction + ')("' + id + '", ' + func + ", " + jsonArgs + ");";

  return new Promise(function (resolve, reject) {
    document.addEventListener(
      id,
      (e) => {
        const detail = (e as CustomEvent<ResultDetail>).detail;
        if (detail) {
          if (detail.error) {
            reject(detail.error);
          } else {
            try {
              resolve(JSON.parse(detail.data));
            } catch (e) {
              reject(e);
            }
          }
        }
      },
      { once: true }
    );

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.appendChild(document.createTextNode(scriptText));
    script.onload = () => script.remove();
    document.body.appendChild(script);
  });
}

export function getGlobalVariable(variable: string) {
  return injectScript(function (variable: string) {
    function getValue(obj: any, vars: string[]): any {
      var value = obj[vars[0]];
      if (vars.length > 1) return getValue(value, vars.slice(1));
      return value;
    }

    var value = getValue(window, variable.split("."));
    return value;
  }, variable);
}
