export interface PortMapping {
  HostIp: string;
  HostPort: string;
}

export interface Port {
  IP: string;
  PrivatePort: number;
  PublicPort: number;
  Type: string;
}

export interface Container {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
  Ports: Port[];
  Created: string;
} 