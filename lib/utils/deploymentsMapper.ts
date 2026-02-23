import { isAfter, format } from 'date-fns';
import { DeploymentStatus } from '../types';

interface IDeployment {
  startedOn: string;
}

const updateDeploymentsDict = (env: string, deployment: any, deploymentDict: any) => {
  if (deploymentDict[env]) {
    const deploymentData = deploymentDict[env];

    deploymentData.push({
      startedOn: format(new Date(deployment.state.started_on), 'dd/MM/yyyy')
    });
  } else {
    deploymentDict[env] = [
      {
        startedOn: format(new Date(deployment.state.started_on), 'dd/MM/yyyy')
      }
    ];
  }

  return deploymentDict;
};

export const deploymentMapper = ({ deployments, days = 14 }: any): any => {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - days);

  let successfulDeploymentDict: Record<string, IDeployment[]> = {};
  let failedDeploymentDict: Record<string, IDeployment[]> = {};

  deployments
    ?.filter((deployment: any) => {
      const deploymentDate = new Date(deployment.state.started_on);
      deploymentDate.setHours(24, 0, 0, 0);

      return isAfter(deploymentDate, startDate);
    })
    .forEach((deployment: any) => {
      const deploymentStatus = deployment.state.status.name;
      const deploymentEnv = deployment.environment.uuid;

      if (deploymentEnv && deploymentStatus === DeploymentStatus.SUCCESSFUL) {
        successfulDeploymentDict = updateDeploymentsDict(
          deploymentEnv,
          deployment,
          successfulDeploymentDict
        );
      }

      if (deploymentEnv && deploymentStatus === DeploymentStatus.FAILED) {
        failedDeploymentDict = updateDeploymentsDict(
          deploymentEnv,
          deployment,
          failedDeploymentDict
        );
      }
    });

  return {
    startDate: new Date(startDate),
    endDate: new Date(),
    successfulDeployments: successfulDeploymentDict,
    failedDeployments: failedDeploymentDict
  };
};
