import React, {useEffect, useState} from 'react';
import Depot from "../class/depots/Depot";
import depotService from "../hooks/DepotService";

const Depots: React.FC = () => {
    const [depots, setDepots] = useState<Array<Depot>>([]);

    useEffect(() => {
        retrieveDepots();
    }, []);

    const retrieveDepots = () => {
        depotService.getAll()
            .then((response: any) => {
                setDepots(response.data);
                console.log(response.data)
            })
            .catch((e: Error) => {
                console.log(e);
            });
    };

    return (
        <div className="overflow-x-auto">
            <table>
                <thead>
                <tr>
                    <th>Depot code</th>
                    <th>City</th>
                    <th>Street</th>
                    <th>Country</th>
                    <th>Postal Code</th>
                    <th>NIP</th>
                    <th>Telephone Number</th>
                    <th>Opening Hours</th>
                </tr>
                </thead>
                <tbody>
                {depots?.map((depot) => (
                    <tr key={depot.depotCode.value}>
                        <td>{depot.depotCode.value}</td>
                        <td>{depot.city}</td>
                        <td>{depot.street}</td>
                        <td>{depot.country}</td>
                        <td>{depot.postalCode}</td>
                        <td>{depot.nip}</td>
                        <td>{depot.telephoneNumber}</td>
                        <td>{depot.openingHours}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );

};

export default Depots;