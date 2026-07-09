import { prisma } from "@/lib/prisma";

export type FactoryPayload = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  displayGroupCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type DisplayGroupPayload = {
  id: string;
  factoryId: string;
  factoryCode: string;
  factoryName: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  deviceCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type DisplayDevicePayload = {
  id: string;
  displayGroupId: string;
  displayGroupCode: string;
  displayGroupName: string;
  code: string;
  name: string;
  location: string | null;
  isActive: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listFactories(): Promise<FactoryPayload[]> {
  const factories = await prisma.factory.findMany({
    include: { _count: { select: { displayGroups: true } } },
    orderBy: [{ code: "asc" }]
  });

  return factories.map((factory) => ({
    id: factory.id,
    code: factory.code,
    name: factory.name,
    description: factory.description,
    isActive: factory.isActive,
    displayGroupCount: factory._count.displayGroups,
    createdAt: factory.createdAt.toISOString(),
    updatedAt: factory.updatedAt.toISOString()
  }));
}

export async function listDisplayGroups(): Promise<DisplayGroupPayload[]> {
  const groups = await prisma.displayGroup.findMany({
    include: {
      factory: { select: { code: true, name: true } },
      _count: { select: { devices: true } }
    },
    orderBy: [{ factory: { code: "asc" } }, { code: "asc" }]
  });

  return groups.map((group) => ({
    id: group.id,
    factoryId: group.factoryId,
    factoryCode: group.factory.code,
    factoryName: group.factory.name,
    code: group.code,
    name: group.name,
    description: group.description,
    isActive: group.isActive,
    deviceCount: group._count.devices,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString()
  }));
}

export async function listDisplayDevices(): Promise<DisplayDevicePayload[]> {
  const devices = await prisma.displayDevice.findMany({
    include: { displayGroup: { select: { code: true, name: true } } },
    orderBy: [{ displayGroup: { code: "asc" } }, { code: "asc" }]
  });

  return devices.map((device) => ({
    id: device.id,
    displayGroupId: device.displayGroupId,
    displayGroupCode: device.displayGroup.code,
    displayGroupName: device.displayGroup.name,
    code: device.code,
    name: device.name,
    location: device.location,
    isActive: device.isActive,
    lastSeenAt: device.lastSeenAt?.toISOString() || null,
    createdAt: device.createdAt.toISOString(),
    updatedAt: device.updatedAt.toISOString()
  }));
}

export function cleanCode(value: unknown) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "-");
}

export function cleanText(value: unknown) {
  return String(value || "").trim();
}