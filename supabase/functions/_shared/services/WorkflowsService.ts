// NO_CHANGE

import {
  BaseRequiredContext,
  BaseSupabaseService,
} from "@/services/_BaseSupabaseService";
import { getEnvKey } from "@/utils/env";

const ENDPOINTS = {
  WORKFLOWS: "/workflows",
  WORKFLOW: "/workflows/:id",
  WORKFLOW_TRANSFER: "/workflows/:id/transfer",
  WORKFLOW_TAGS: "/workflows/:id/tags",
  TAGS: "/tags",
  TAG: "/tags/:tagId",
};

import type {
  CallN8NApiParams,
  WorkspaceTag,
  WorkflowPayload,
} from "@/types/workflows";

class WorkflowsService extends BaseSupabaseService {
  n8n_api_key: string;
  n8n_instance: string;
  n8n_project_id: string;
  BASE_URL: string;

  constructor(public context: BaseRequiredContext) {
    super(context);
    this.tableName = "workflows";
    this.n8n_api_key = getEnvKey("N8N_API_KEY");
    this.n8n_instance = getEnvKey("N8N_INSTANCE");
    this.n8n_project_id = getEnvKey("N8N_PROJECT_ID");
    this.BASE_URL = `https://${this.n8n_instance}/api/v1`;
  }

  async callN8NApi({
    path,
    method,
    body,
    queryParams = {},
    options = {},
  }: CallN8NApiParams) {
    const queryString = new URLSearchParams(queryParams).toString();

    const endpoint = `${this.BASE_URL}${path}${
      queryString ? `?${queryString}` : ""
    }`;
    this.logger.info(`Calling N8N API: ${endpoint}`);

    const response = await fetch(endpoint, {
      method,
      headers: {
        "X-N8N-API-KEY": this.n8n_api_key,
        "Content-Type": "application/json",
      },
      body: method === "GET" ? undefined : JSON.stringify(body),
    });
    let json = null;

    if (!options.noJson) {
      json = await response.json();
    }

    if (!response.ok) {
      if (method === "PUT") {
        json = await response.json();
      }

      this.logger.debug("n8n response --> ", json);
      this.logger.debug("n8n body --> ", body);

      this.throwError(`Failed to call N8N API: ${response.statusText}`, json);
    }

    return json;
  }

  async getWorkspaceTag(tagId: string) {
    const response = await this.callN8NApi({
      path: ENDPOINTS.TAG.replace(":tagId", tagId),
      method: "GET",
    });

    return response;
  }

  async getWorkflow(workflowId: string) {
    const internalWorkflow = await this.getById(workflowId);

    if (!internalWorkflow) {
      this.throwError("Workflow not found", 404);
    }

    const response = await this.callN8NApi({
      path: ENDPOINTS.WORKFLOW.replace(
        ":id",
        internalWorkflow.external_workflow_id
      ),
      method: "GET",
    });

    return {
      ...internalWorkflow,
      externalWorkflow: response,
    };
  }

  async getWorkflows(workspaceTagName: string) {
    const response = await this.callN8NApi({
      path: ENDPOINTS.WORKFLOWS,
      method: "GET",
      queryParams: {
        tags: [workspaceTagName].join(","),
      },
    });

    return response.data;
  }

  async createWorkflow(workspaceTag: WorkspaceTag, payload: WorkflowPayload) {
    if (!payload.name) {
      this.throwError("Name is required", 406);
    }

    if (!payload.tenant_id) {
      this.throwError("Tenant ID is required", 406);
    }

    if (!payload.user_id) {
      this.throwError("User ID is required", 406);
    }

    const n8nWorkflowPayload = {
      name: `[${workspaceTag.name}] ${payload.name}`,
      nodes: [],
      connections: {
        main: [],
      },
      settings: {
        saveExecutionProgress: true,
        saveManualExecutions: true,
        saveDataErrorExecution: "all",
        saveDataSuccessExecution: "all",
        executionTimeout: 3600,
        // errorWorkflow: "VzqKEW0ShTXA5vPj",
        // TODO: Make this dynamic
        timezone: "Australia/Sydney",
        executionOrder: "v1",
      },
      staticData: {},
    };

    const n8nWorkflow = await this.callN8NApi({
      path: ENDPOINTS.WORKFLOWS,
      method: "POST",
      body: n8nWorkflowPayload,
    });

    const workflowId = n8nWorkflow.id;

    await this.callN8NApi({
      path: ENDPOINTS.WORKFLOW_TRANSFER.replace(":id", workflowId),
      method: "PUT",
      body: {
        destinationProjectId: this.n8n_project_id,
      },
      options: { noJson: true },
    });

    await this.callN8NApi({
      path: ENDPOINTS.WORKFLOW_TAGS.replace(":id", workflowId),
      method: "PUT",
      body: [{ id: workspaceTag.id }],
      options: { noJson: true },
    });

    const internalResponse = await this.create({
      external_workflow_id: workflowId,
      name: payload.name,
      description: payload.description,
      is_active: false,
      created_by: payload.user_id,
      tenant_id: payload.tenant_id,
    });

    const internalWorkflow = internalResponse[0];

    return {
      ...internalWorkflow,
      externalWorkflow: n8nWorkflow,
    };
  }

  async updateWorkflow(workspaceTag: WorkspaceTag, payload: WorkflowPayload) {
    const { externalWorkflow: _, ...rest } = payload;

    if (!payload.id) {
      return this.throwError("Workflow ID is required", 406);
    }

    if (!payload.externalWorkflow) {
      return this.throwError("External workflow is required", 406);
    }

    let externalWorkflow = payload.externalWorkflow;

    if (payload.externalWorkflow) {
      const name = `[${workspaceTag.name}] ${payload.name}`;
      const nodes = payload.externalWorkflow.nodes;
      const connections = payload.externalWorkflow.connections;
      const settings = payload.externalWorkflow.settings;
      const staticData = payload.externalWorkflow.staticData;

      externalWorkflow = await this.callN8NApi({
        path: ENDPOINTS.WORKFLOW.replace(":id", payload.externalWorkflow.id),
        method: "PUT",
        body: { name, nodes, connections, settings, staticData },
      });
    }

    const internalResponse = await this.update(payload.id, {
      ...rest,
    });

    return { ...internalResponse[0], externalWorkflow };
  }

  async deleteWorkflow(workspaceTag: WorkspaceTag, workflowId: string) {
    const internalWorkflow = await this.getById(workflowId);

    if (!internalWorkflow) {
      return this.throwError("Workflow not found", 404);
    }

    await this.callN8NApi({
      path: ENDPOINTS.WORKFLOW.replace(
        ":id",
        internalWorkflow.external_workflow_id
      ),
      method: "DELETE",
      options: { noJson: true },
    });

    await this.delete(workflowId);

    return {
      message: "Workflow deleted successfully",
    };
  }
}

export { WorkflowsService };
