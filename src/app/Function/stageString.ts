import { GroupItem } from '../models/task.models';

export function getStageString(data: GroupItem): Array<string> {
  const stageStrs = [
    [],
    [],
    ['初张拉', '阶段一', '终张拉'],
    ['初张拉', '阶段一', '阶段二', '终张拉'],
    ['初张拉', '阶段一', '阶段二', '阶段三', '终张拉']
  ];
  let stage = data.tensionStage;
  console.log(stage);
  if (data.twice) {
    stage -= 1;
  }
  if (data.super) {
    stage -= 1;
  }
  const stageStr = stageStrs[stage];
  if (data.twice) {
    stageStr.splice(3, 0, '阶段二·2');
  }
  if (data.super) {
    stageStr.push('超张拉');
  }
  return stageStr;
}
