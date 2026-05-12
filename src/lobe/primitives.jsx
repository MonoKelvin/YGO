/**
 * Lobe @lobehub/ui 部分组件在暗色下默认 variant 为 filled；
 * 若需与表单统一为 outlined，可在业务处为各组件传入 `variant="outlined"`，
 * 或在此处封装后再从本文件导出（当前业务代码已改为直接使用 `@lobehub/ui` / `@lobehub/ui/base-ui`）。
 */
import {
  Button as LobeButton,
  Input as LobeInput,
  InputNumber as LobeInputNumber,
  SearchBar as LobeSearchBar,
  Segmented as LobeSegmented,
  TextArea as LobeTextArea,
} from '@lobehub/ui'

export function Input(props) {
  return <LobeInput {...props} variant={props.variant ?? 'outlined'} />
}

export function InputNumber(props) {
  return <LobeInputNumber {...props} variant={props.variant ?? 'outlined'} />
}

export function TextArea(props) {
  return <LobeTextArea {...props} variant={props.variant ?? 'outlined'} />
}

export function SearchBar(props) {
  return <LobeSearchBar {...props} variant={props.variant ?? 'outlined'} />
}

export function Segmented(props) {
  return <LobeSegmented {...props} variant={props.variant ?? 'outlined'} />
}

export function Button(props) {
  const { type, variant, color, danger, ...rest } = props
  const v = variant ?? 'outlined'

  if (type === 'link' || type === 'text') {
    return <LobeButton {...props} />
  }

  if (type === 'primary') {
    return (
      <LobeButton
        {...rest}
        color="primary"
        danger={danger}
        variant={v}
      />
    )
  }

  if (type === 'default') {
    return <LobeButton {...rest} danger={danger} variant={v} />
  }

  if (type === 'dashed') {
    return <LobeButton {...rest} type="dashed" danger={danger} />
  }

  return <LobeButton {...rest} type={type} danger={danger} variant={v} />
}
