import React, {useEffect, useState} from 'react';
import SoftwareConfigurationList from "./SoftwareConfiguration";
import Software from "./model/Software";
import SoftwareConfigurationService from "../../hooks/SoftwareConfigurationService";
import pl from "../../i18n/translate";

const SoftwarePropertyList: React.FC = () => {
    const [softwareProperties, setSoftwareProperties] = useState<Software[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await SoftwareConfigurationService.getAll();
                setSoftwareProperties(response.data);
            } catch (error) {
                console.error(pl.softwareConfiguration.messages.loadError, error);
            }
        };

        fetchData();
    }, []);


    const handleUpdate = async (id: string, category: string, name: string, value: string) => {
        try {
            // Assuming SoftwareConfigurationService.update() returns the updated Software item
            const updatedSoftware = await SoftwareConfigurationService.update(id, {
                category,
                name,
                value,
            });

            setSoftwareProperties((prevProperties) => {
                return prevProperties.map((item) => (item.id === id ? updatedSoftware : item)) as Software[];
            });
        } catch (error) {
            console.error(pl.softwareConfiguration.messages.updateError, error);
        }
        window.location.reload();
    };

    return (
        <div>
            <h1>{pl.softwareConfiguration.title}</h1>
            <SoftwareConfigurationList softwareProperties={softwareProperties} onUpdate={handleUpdate} />
        </div>
    );
};

export default SoftwarePropertyList;
