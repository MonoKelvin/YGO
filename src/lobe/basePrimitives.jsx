/**
 * @lobehub/ui/base-ui 的 Select 默认 variant 可能为 filled；需要 outlined 时在调用处传 `variant="outlined"`。
 */
import { Select as BaseSelect } from '@lobehub/ui/base-ui'

export function Select(props) {
  return <BaseSelect {...props} variant={props.variant ?? 'outlined'} />
}

export { Switch } from '@lobehub/ui/base-ui'
