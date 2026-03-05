import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const VENUES = {
    "cticc_hall_1": {
        name: "CTICC Hall 1",
        dimensions: { width: 45, length: 60, height: 10 },
        capacity: { standing: 3000, banquet: 1500 },
        power_drops: ["North Wall", "South Wall", "Ceiling Grid Grid 2"],
        rigging_capacity_kg_per_point: 500,
        obstructions: ["Pillars at Grid 4x4", "Pillars at Grid 4x8"]
    },
    "sandton_pavilion": {
        name: "Sandton Convention Centre - The Pavilion",
        dimensions: { width: 30, length: 40, height: 8 },
        capacity: { standing: 1500, banquet: 800 },
        power_drops: ["East Wall", "West Wall"],
        rigging_capacity_kg_per_point: 250,
        obstructions: []
    }
};

const server = new Server(
    {
        name: "event-saas-venue-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_venue_specs",
                description: "Retrieve exact physical dimensions, capacity, and rigging specs for a specific venue.",
                inputSchema: {
                    type: "object",
                    properties: {
                        venue_id: {
                            type: "string",
                            description: "The ID of the venue (e.g., 'cticc_hall_1' or 'sandton_pavilion')",
                        },
                    },
                    required: ["venue_id"],
                },
            },
            {
                name: "list_venues",
                description: "List all venues available in the database with their IDs.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            }
        ],
    };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "list_venues") {
        const list = Object.entries(VENUES).map(([id, data]) => ({ id, name: data.name }));
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(list, null, 2),
                },
            ],
        };
    }

    if (request.params.name === "get_venue_specs") {
        const venueId = request.params.arguments?.venue_id;
        const venue = VENUES[venueId];

        if (!venue) {
            throw new Error(`Venue not found: ${venueId}. Try using list_venues first.`);
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(venue, null, 2),
                },
            ],
        };
    }

    throw new Error(`Tool not found: ${request.params.name}`);
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Venue Specs MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
