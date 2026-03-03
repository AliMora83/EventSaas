import React, { useState } from 'react'
import { Settings as SettingsIcon, Building, Users, Key, Bell } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function Settings() {
    const [tab, setTab] = useState('org')

    const tabs = [
        { key: 'org', label: 'Organisation' },
        { key: 'users', label: 'Users' },
        { key: 'api', label: 'API Keys' },
        { key: 'notifications', label: 'Notifications' },
    ]

    return (
        <div className="space-y-4">
            <Tabs tabs={tabs} active={tab} onChange={setTab} />

            {tab === 'org' && (
                <Card>
                    <CardHeader title="Organisation Settings" />
                    <CardBody className="max-w-lg space-y-4">
                        <Input label="Organisation Name" defaultValue="Namka Events Production" />
                        <Input label="VAT Number" defaultValue="4123456789" />
                        <Input label="Currency" value="ZAR" disabled />
                        <Input label="Timezone" value="Africa/Johannesburg" disabled />
                        <Button variant="primary" size="sm">Save Changes</Button>
                    </CardBody>
                </Card>
            )}

            {tab === 'users' && (
                <Card>
                    <CardHeader title="User Management" action={<Button size="sm" icon={<Users size={13} />}>Invite User</Button>} />
                    <CardBody>
                        <p className="text-ink3 text-[13px]">User management and role assignment coming soon.</p>
                    </CardBody>
                </Card>
            )}

            {tab === 'api' && (
                <div className="space-y-3 max-w-lg">
                    <Card>
                        <CardHeader title="Firebase Configuration" />
                        <CardBody className="space-y-3">
                            <Input label="Project ID" defaultValue="eventsaas-namka" disabled />
                            <Input label="Auth Domain" defaultValue="eventsaas-namka.firebaseapp.com" disabled />
                        </CardBody>
                    </Card>
                    <Card>
                        <CardHeader title="AI / Integrations" />
                        <CardBody className="space-y-3">
                            <Input label="Gemini API Key" type="password" placeholder="AIza…" />
                            <Input label="Resend API Key" type="password" placeholder="re_…" />
                            <Input label="Xero Client ID" placeholder="Coming in Phase 2" disabled />
                            <Button variant="primary" size="sm">Save API Keys</Button>
                        </CardBody>
                    </Card>
                </div>
            )}

            {tab === 'notifications' && (
                <Card>
                    <CardHeader title="Notification Preferences" />
                    <CardBody>
                        <p className="text-ink3 text-[13px]">Notification settings coming soon.</p>
                    </CardBody>
                </Card>
            )}
        </div>
    )
}
